import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { Document } from "../types";

// Keep a local cache of blob URLs to allow viewing uploaded files in the same session
const localBlobUrls: { [storagePath: string]: string } = {};

export const documentService = {
  // Validate file properties
  validateFile(file: File) {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Formato de ficheiro não suportado. Use PDF, JPEG, PNG ou WEBP.");
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      throw new Error("O tamanho do ficheiro não pode exceder 10 MB.");
    }
  },

  // Sanitize filename
  sanitizeFilename(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/[^a-zA-Z0-9.-]/g, "_") // replace spaces and symbols
      .substring(0, 80);
  },

  // 1. Upload document (private storage + metadata insertion)
  async uploadDocument(
    tripId: string,
    file: File,
    allowedForConsultor: boolean
  ): Promise<Document> {
    this.validateFile(file);

    if (!isSupabaseConfigured) {
      const docId = "doc-" + Date.now();
      const safeName = this.sanitizeFilename(file.name);
      const storagePath = `${tripId}/${docId}/${safeName}`;

      // Create a local session URL so the user can actually view/download their uploaded document
      const blobUrl = URL.createObjectURL(file);
      localBlobUrls[storagePath] = blobUrl;

      // POST metadata to Express backend
      const sizeStr = `${Math.round(file.size / 1024)} KB`;
      const resp = await fetch(`/api/trips/${tripId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          size: sizeStr,
          allowedForConsultor
        })
      });

      if (!resp.ok) {
        throw new Error("Falha ao salvar metadados do documento localmente.");
      }

      // Read returned trip to find the actual inserted document ID if needed,
      // but we can also just return the generated one since they are functionally identical
      return {
        id: docId,
        name: file.name,
        type: file.type,
        fileUrl: storagePath,
        dateUploaded: new Date().toISOString().split("T")[0],
        size: sizeStr,
        allowedForConsultor
      };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado.");

    // Generate unique ID and safe path
    const docId = "doc-" + Date.now();
    const safeName = this.sanitizeFilename(file.name);
    const storagePath = `${tripId}/${docId}/${safeName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("trip-documents")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Erro ao carregar ficheiro para o Storage: ${uploadError.message}`);
    }

    // Insert metadata record in PostgreSQL
    const { data: docRow, error: dbError } = await supabase
      .from("documents")
      .insert({
        id: docId,
        trip_id: tripId,
        uploaded_by: user.id,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        document_type: file.type.includes("pdf") ? "receipt" : "other", // default
        allowed_for_consultor: allowedForConsultor
      })
      .select()
      .single();

    if (dbError) {
      // Clean up orphaned storage object
      await supabase.storage.from("trip-documents").remove([storagePath]);
      console.error("Database document insertion error:", dbError);
      throw new Error(`Erro ao guardar metadados do documento: ${dbError.message}`);
    }

    return {
      id: docRow.id,
      name: docRow.original_filename,
      type: docRow.mime_type,
      fileUrl: docRow.storage_path,
      dateUploaded: docRow.created_at.split("T")[0],
      size: `${Math.round(docRow.file_size_bytes / 1024)} KB`,
      allowedForConsultor: docRow.allowed_for_consultor
    };
  },

  // 2. Download / View via temporary signed URL
  async getSignedUrl(storagePath: string): Promise<string> {
    if (!isSupabaseConfigured) {
      // Return cached local blob URL or a placeholder
      return localBlobUrls[storagePath] || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80";
    }

    const { data, error } = await supabase.storage
      .from("trip-documents")
      .createSignedUrl(storagePath, 3600); // 1 hour validity

    if (error || !data) {
      console.error("Error creating signed URL:", error);
      throw new Error(`Não foi possível gerar a ligação de acesso ao documento: ${error?.message}`);
    }

    return data.signedUrl;
  },

  // 3. Delete document (removes from storage and database)
  async deleteDocument(docId: string, storagePath: string): Promise<void> {
    if (!isSupabaseConfigured) {
      // Clean up local blob URL
      const blobUrl = localBlobUrls[storagePath];
      if (blobUrl) {
        try { URL.revokeObjectURL(blobUrl); } catch {}
        delete localBlobUrls[storagePath];
      }

      // Delete from Express backend
      const tripId = storagePath.split("/")[0];
      if (tripId) {
        try {
          await fetch(`/api/trips/${tripId}/documents/${docId}`, {
            method: "DELETE"
          });
        } catch (err) {
          console.error("Local deleteDocument failed:", err);
        }
      }
      return;
    }

    // 1. Delete from Supabase Storage
    const { error: storageErr } = await supabase.storage
      .from("trip-documents")
      .remove([storagePath]);

    if (storageErr) {
      console.warn("Storage deletion warning or failure:", storageErr);
    }

    // 2. Delete database record
    const { error: dbErr } = await supabase
      .from("documents")
      .delete()
      .eq("id", docId);

    if (dbErr) {
      throw new Error(`Erro ao eliminar o registo do documento na base de dados: ${dbErr.message}`);
    }
  }
};
export type { Document };
