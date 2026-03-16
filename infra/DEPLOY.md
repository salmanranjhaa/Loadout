# Deploying LifePlan to Google Cloud (Compute Engine + Cloud SQL)

This guide walks through deploying the entire stack to your GCP project.
You will use Compute Engine for the app and Cloud SQL for the database.

## Prerequisites

- GCP project with billing enabled
- `gcloud` CLI installed and authenticated
- Docker installed locally (for building images)
- Your GCP project ID (run `gcloud config get-value project`)

## Step 1: Set Up Environment Variables

```bash
# I set the project variables
export PROJECT_ID="your-gcp-project-id"
export REGION="europe-west6"       # Zurich, closest to St. Gallen
export ZONE="europe-west6-a"
export INSTANCE_NAME="lifeplan-vm"
export SQL_INSTANCE="lifeplan-db"
export DB_PASSWORD="$(openssl rand -base64 24)"

echo "DB Password: $DB_PASSWORD"   # Save this somewhere safe!
```

## Step 2: Enable Required APIs

```bash
gcloud services enable \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  aiplatform.googleapis.com \
  artifactregistry.googleapis.com \
  --project=$PROJECT_ID
```

## Step 3: Create Cloud SQL Instance (PostgreSQL)

```bash
# I create a small PostgreSQL instance (db-f1-micro is cheapest, ~$10/month)
gcloud sql instances create $SQL_INSTANCE \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-size=10GB \
  --storage-auto-increase \
  --project=$PROJECT_ID

# I create the database
gcloud sql databases create lifeplan_db \
  --instance=$SQL_INSTANCE \
  --project=$PROJECT_ID

# I create the database user
gcloud sql users create lifeplan_user \
  --instance=$SQL_INSTANCE \
  --password=$DB_PASSWORD \
  --project=$PROJECT_ID
```

## Step 4: Create Artifact Registry (Docker Repository)

```bash
gcloud artifacts repositories create lifeplan-repo \
  --repository-format=docker \
  --location=$REGION \
  --project=$PROJECT_ID

# I configure Docker to push to GCR
gcloud auth configure-docker ${REGION}-docker.pkg.dev
```

## Step 5: Build and Push Docker Images

```bash
# I navigate to the project root
cd /path/to/lifeplan

# I build and push the backend
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/backend:latest ./backend
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/backend:latest

# I build the frontend with production API URL
cd frontend
echo "VITE_API_URL=/api/v1" > .env
cd ..

docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/frontend:latest ./frontend
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/frontend:latest
```

## Step 6: Create a Service Account for Vertex AI

```bash
# I create a service account for the VM
gcloud iam service-accounts create lifeplan-sa \
  --display-name="LifePlan Service Account" \
  --project=$PROJECT_ID

# I grant Vertex AI permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lifeplan-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# I grant Cloud SQL client access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lifeplan-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# I grant Artifact Registry reader
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lifeplan-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

## Step 7: Create Compute Engine VM

```bash
# I create an e2-small instance (2 vCPU, 2GB RAM, ~$15/month)
gcloud compute instances create $INSTANCE_NAME \
  --zone=$ZONE \
  --machine-type=e2-small \
  --image-family=cos-stable \
  --image-project=cos-cloud \
  --boot-disk-size=20GB \
  --service-account=lifeplan-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --scopes=cloud-platform \
  --tags=http-server,https-server \
  --project=$PROJECT_ID

# I allow HTTP and HTTPS traffic
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 \
  --target-tags=http-server \
  --project=$PROJECT_ID

gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 \
  --target-tags=https-server \
  --project=$PROJECT_ID
```

## Step 8: Get the Cloud SQL Connection Name

```bash
# I get the connection name for the SQL proxy
gcloud sql instances describe $SQL_INSTANCE \
  --format="value(connectionName)" \
  --project=$PROJECT_ID

# It will be something like: your-project:europe-west6:lifeplan-db
export SQL_CONNECTION_NAME="$PROJECT_ID:$REGION:$SQL_INSTANCE"
```

## Step 9: SSH into the VM and Deploy

```bash
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --project=$PROJECT_ID
```

Once inside the VM:

```bash
# I authenticate Docker with Artifact Registry
docker-credential-gcr configure-docker --registries=${REGION}-docker.pkg.dev

# I pull the Cloud SQL proxy
docker pull gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.1

# I create a Docker network
docker network create lifeplan-net

# I start the Cloud SQL proxy
docker run -d \
  --name sql-proxy \
  --network lifeplan-net \
  --restart always \
  gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.8.1 \
  --address 0.0.0.0 \
  --port 5432 \
  ${SQL_CONNECTION_NAME}

# I start the backend
docker run -d \
  --name backend \
  --network lifeplan-net \
  --restart always \
  -e DATABASE_URL="postgresql+asyncpg://lifeplan_user:${DB_PASSWORD}@sql-proxy:5432/lifeplan_db" \
  -e DATABASE_URL_SYNC="postgresql+psycopg2://lifeplan_user:${DB_PASSWORD}@sql-proxy:5432/lifeplan_db" \
  -e SECRET_KEY="$(openssl rand -base64 32)" \
  -e GCP_PROJECT_ID="${PROJECT_ID}" \
  -e GCP_REGION="europe-west6" \
  -e VERTEX_AI_MODEL="gemini-1.5-flash" \
  -p 8000:8000 \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/backend:latest

# I run the database migration and seed
docker exec backend python -c "
import asyncio
from app.core.database import engine, Base
from app.models.user import User
from app.models.schedule import ScheduleEvent, ScheduleModification
from app.models.meal import MealTemplate, MealLog, GroceryList
from app.models.analytics import WeightLog, WorkoutLog, DailySnapshot

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Tables created.')

asyncio.run(init())
"

# I run the seed script
docker exec backend python -m scripts.seed

# I start the frontend
docker run -d \
  --name frontend \
  --network lifeplan-net \
  --restart always \
  -p 80:80 \
  ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/frontend:latest
```

## Step 10: Get the External IP

```bash
# I get the VM's external IP
gcloud compute instances describe $INSTANCE_NAME \
  --zone=$ZONE \
  --format="value(networkInterfaces[0].accessConfigs[0].natIP)" \
  --project=$PROJECT_ID
```

Open `http://<EXTERNAL_IP>` in your phone browser. Since it is a PWA, you can "Add to Home Screen" for an app like experience.

## Step 11: (Optional) Set Up a Domain + HTTPS

```bash
# I reserve a static IP
gcloud compute addresses create lifeplan-ip \
  --region=$REGION \
  --project=$PROJECT_ID

# I point your domain DNS A record to this IP
# Then install Certbot on the VM for Let's Encrypt HTTPS:

# SSH into VM
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE

# I install certbot via Docker
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone -d yourdomain.com
```

## Estimated Monthly Cost

| Service                  | Cost (approx)       |
|--------------------------|---------------------|
| Compute Engine (e2-small)| ~$15/month          |
| Cloud SQL (db-f1-micro)  | ~$10/month          |
| Vertex AI (Gemini Flash) | ~$2-5/month (usage) |
| Artifact Registry        | ~$1/month           |
| **Total**                | **~$28-31/month**   |

## Updating the App

```bash
# I rebuild and push from local machine
docker build -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/backend:latest ./backend
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/backend:latest

# I SSH into VM and restart
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE
docker pull ${REGION}-docker.pkg.dev/${PROJECT_ID}/lifeplan-repo/backend:latest
docker stop backend && docker rm backend
# I re-run the backend docker run command from Step 9
```

## Troubleshooting

**Backend not connecting to Cloud SQL:**
Check if the sql-proxy container is running: `docker logs sql-proxy`

**Vertex AI errors:**
Ensure the service account has `roles/aiplatform.user` and the API is enabled.

**Frontend not loading:**
Check nginx config and ensure the backend container is named "backend" on the same Docker network.

**PWA not installing on phone:**
You need HTTPS (Step 11) for the PWA "Add to Home Screen" prompt to appear. Without HTTPS, the app still works in the browser, just without the install prompt.
