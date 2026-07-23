import { Express } from 'express';

export interface ParsedProductUploadFile {
  buffer: Buffer;
  mimetype: string;
}

export interface ParsedProductUploads {
  imageFiles: Array<ParsedProductUploadFile & { is_primary?: boolean }>;
  variantImageFiles: Map<number, ParsedProductUploadFile>;
}

export function parseProductUploadFiles(files: Express.Multer.File[] | undefined): ParsedProductUploads {
  const imageFiles: ParsedProductUploads['imageFiles'] = [];
  const variantImageFiles = new Map<number, ParsedProductUploadFile>();

  for (const file of files ?? []) {
    if (file.fieldname === 'images') {
      imageFiles.push({
        buffer: file.buffer,
        mimetype: file.mimetype,
        is_primary: imageFiles.length === 0,
      });
      continue;
    }

    const variantMatch = file.fieldname.match(/^variant_image_(\d+)$/);
    if (variantMatch) {
      variantImageFiles.set(Number(variantMatch[1]), {
        buffer: file.buffer,
        mimetype: file.mimetype,
      });
    }
  }

  return { imageFiles, variantImageFiles };
}

export type VariantImageRecord = { url: string; public_id: string };

export type VariantInput = {
  id?: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  price?: number | null;
  discount_price?: number | null;
  stock_quantity?: number;
  delete_image_public_id?: string | null;
};
