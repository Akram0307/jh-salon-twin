import { query } from '../config/db'

export type FeatureRecord = {
  salon_id: string
  entity_type: string
  entity_id: string
  feature_key: string
  feature_value: number
}

export class FeatureStoreService {
  async setFeature(record: FeatureRecord) {
    await query(
      `INSERT INTO ai_feature_store
      (salon_id, entity_type, entity_id, feature_key, feature_value)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (salon_id,entity_type,entity_id,feature_key)
      DO UPDATE SET feature_value = EXCLUDED.feature_value`,
      [
        record.salon_id,
        record.entity_type,
        record.entity_id,
        record.feature_key,
        record.feature_value
      ]
    )
  }

  async getFeatures(salon_id: string, entity_type: string, entity_id: string) {
    const res = await query(
      `SELECT feature_key, feature_value
       FROM ai_feature_store
       WHERE salon_id=$1 AND entity_type=$2 AND entity_id=$3`,
      [salon_id, entity_type, entity_id]
    )

    const features: Record<string, number> = {}

    for (const row of res.rows) {
      features[row.feature_key] = Number(row.feature_value)
    }

    return features
  }
}

export const featureStore = new FeatureStoreService()
