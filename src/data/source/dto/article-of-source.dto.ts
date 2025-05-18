export class ArticleOfSourceDto {
  id: string;
  title: string;
  url: string;
  publicationDate: string | null;
  createdAt: string;
  updatedAt: string | null;
  groupId: string | null;
  languageBias?: number;
  politicalBiasConfidence?: number;
  politicalBiasOrientation?: string;
}