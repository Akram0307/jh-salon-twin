# GCP Infrastructure Report
Generated: Wed Mar 18 10:11:42 UTC 2026

## VPC Connectors
```
CONNECTOR_ID           REGION       NETWORK  IP_CIDR_RANGE  SUBNET  SUBNET_PROJECT  MACHINE_TYPE  MIN_INSTANCES  MAX_INSTANCES  MIN_THROUGHPUT  MAX_THROUGHPUT  STATE
salonos-staging-vpc    us-central1  default  10.8.0.0/28                            e2-micro      2              10             200             1000            ERROR
salonos-vpc-connector  us-central1  default  10.8.0.0/28                            e2-micro      2              3              200             300             READY
```

## Cloud SQL
```
NAME              DATABASE_VERSION  LOCATION       TIER         PRIMARY_ADDRESS  PRIVATE_ADDRESS  STATUS
salon-booking-db  POSTGRES_15       us-central1-c  db-f1-micro  34.29.171.92     -                RUNNABLE
```

## Redis
```
INSTANCE_NAME  VERSION    REGION       TIER   SIZE_GB  HOST         PORT  NETWORK  RESERVED_IP     STATUS  CREATE_TIME
salonos-redis  REDIS_7_2  us-central1  BASIC  1        10.215.7.43  6379  default  10.215.7.40/29  READY   2026-03-10T05:50:39
```

## Cloud Run Services
```
   SERVICE                         REGION       URL                                                                      LAST DEPLOYED BY                                            LAST DEPLOYED AT
!  salonos-backend                 us-central1  https://salonos-backend-687369167038.us-central1.run.app                 super-agent-zero@salon-saas-487508.iam.gserviceaccount.com  2026-03-17T16:40:46.955404Z
!  salonos-backend-staging         us-central1  https://salonos-backend-staging-687369167038.us-central1.run.app         super-agent-zero@salon-saas-487508.iam.gserviceaccount.com  2026-03-18T10:03:50.065861Z
✔  salonos-client-frontend         us-central1  https://salonos-client-frontend-687369167038.us-central1.run.app         super-agent-zero@salon-saas-487508.iam.gserviceaccount.com  2026-03-17T16:40:46.060095Z
✔  salonos-owner-frontend          us-central1  https://salonos-owner-frontend-687369167038.us-central1.run.app          super-agent-zero@salon-saas-487508.iam.gserviceaccount.com  2026-03-17T14:34:34.645682Z
…  salonos-owner-frontend-staging  us-central1  https://salonos-owner-frontend-staging-687369167038.us-central1.run.app  super-agent-zero@salon-saas-487508.iam.gserviceaccount.com  2026-03-18T10:11:44.009344Z
```

## Service Account Roles
```
ROLE
roles/artifactregistry.reader
roles/artifactregistry.writer
roles/cloudsql.client
roles/iam.serviceAccountUser
roles/logging.logWriter
roles/monitoring.metricWriter
roles/run.admin
roles/secretmanager.secretAccessor
roles/secretmanager.viewer
```

## Secrets
```
NAME
gcp-json-key
google-service-account
google-sheets-id
kms-key-path
openrouter-api-key
salonos-staging-DB_HOST
salonos-staging-DB_NAME
salonos-staging-DB_PASSWORD
salonos-staging-DB_PORT
salonos-staging-DB_USER
salonos-staging-INSTANCE_CONNECTION_NAME
salonos-staging-JWT_SECRET_STAGING
salonos-staging-OPENROUTER_API_KEY
salonos-staging-REDIS_HOST
salonos-staging-REDIS_PORT
salonos-staging-REFRESH_TOKEN_SECRET_STAGING
salonos-staging-SMTP_HOST
salonos-staging-SMTP_PASS
salonos-staging-SMTP_USER
salonos-staging-STAGING_BASIC_AUTH_PASSWORD
salonos-staging-TWILIO_ACCOUNT_SID
salonos-staging-TWILIO_AUTH_TOKEN
salonos-staging-TWILIO_WHATSAPP_NUMBER
twilio-account-sid
twilio-api-key-secret
twilio-api-key-sid
twilio-auth-token
upstash-redis-rest-token
upstash-redis-rest-url
upstash-redis-url
```
