export type SourceStatus = "online" | "syncing" | "live" | "disconnected";

export interface SourceRow {
  name: string;
  host: string;
  protocol: string;
  status: SourceStatus;
  recordCount: string;
  recordLive?: boolean;
  lastSync: string;
}

export const sources: SourceRow[] = [
  {
    name: "UserProfiles_Master",
    host: "pg-cluster-01.internal",
    protocol: "PostgreSQL",
    status: "online",
    recordCount: "1,248,302",
    lastSync: "02:44:12 Ago",
  },
  {
    name: "Global_Semantic_Embeds",
    host: "pinecone.us-east-1.aws",
    protocol: "Vector DB",
    status: "syncing",
    recordCount: "45,201,993",
    lastSync: "Syncing...",
  },
  {
    name: "Stripe_Transaction_Feed",
    host: "api.stripe.com/v1/events",
    protocol: "REST API",
    status: "live",
    recordCount: "Live Stream",
    recordLive: true,
    lastSync: "00:00:04 Ago",
  },
  {
    name: "Raw_Audit_Logs_2024",
    host: "s3://forge-bucket-prod/archive",
    protocol: "AWS S3",
    status: "online",
    recordCount: "4.2 TB",
    lastSync: "Daily @ 01:00",
  },
  {
    name: "Warehouse_Legacy_Archive",
    host: "snowflake.prod.local",
    protocol: "Snowflake",
    status: "disconnected",
    recordCount: "Disconnected",
    lastSync: "---",
  },
];

export const sourcesStats = {
  globalLatency: "24.5ms avg",
  storageUtilizationPct: 0.74,
  activeStorage: "12.8 TB",
  healthIndex: [0.6, 0.85, 0.7, 0.8, 0.75, 0.9, 0.55],
  uptime: "99.98% Uptime",
};
