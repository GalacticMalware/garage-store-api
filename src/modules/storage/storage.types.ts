export interface StorageRow {
  id: number;
  uuid: string;
  user_id: number;
  name: string;
  url: string;
}

export interface CreateStorageInput {
  uuid: string;
  userId: number;
  name: string;
  url: string;
}
