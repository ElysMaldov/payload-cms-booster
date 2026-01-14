export interface CollectionInfo {
  name: string;
  slug: string;
  label?: string;
  fields: FieldInfo[];
  relationships: RelationshipInfo[];
}

export interface FieldInfo {
  name: string;
  type: string;
  relationTo?: string;
  hasMany?: boolean;
}

export interface RelationshipInfo {
  fromCollection: string;
  fromField: string;
  toCollection: string;
  relationType: "hasOne" | "hasMany" | "belongsTo" | "belongsToMany";
}