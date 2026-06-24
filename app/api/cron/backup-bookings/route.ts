



import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BACKUP_BUCKET = "backups";
const RETENTION_DAYS = 30;
const PAGE_SIZE = 1000;

async function fetchAllRows<T>(supabase: any, table: string): Promise<T[]> {
  let allRows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Erro ao exportar ${table}: ${error.message}`);
    }

    const rows = data ?? [];
    allRows = allRows.concat(rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return allRows;
}

function getBackupFileName(date: Date) {
  const yyyyMmDd = date.toISOString().slice(0, 10);
  return `alicantissima-bookings-${yyyyMmDd}.json`;
}

function getDateFromBackupFileName(fileName: string) {
  const match = fileName.match(/^alicantissima-bookings-(\d{4}-\d{2}-\d{2})\.json$/);

  if (!match) {
    return null;
  }

  const date = new Date(`${match[1]}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function removeOldBackups(supabase: any, now: Date) {
  const { data, error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .list("", {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    throw new Error(`Erro ao listar backups antigos: ${error.message}`);
  }

  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);

  const filesToRemove =
    data
      ?.filter((file) => {
        const backupDate = getDateFromBackupFileName(file.name);
        return backupDate !== null && backupDate < cutoff;
      })
      .map((file) => file.name) ?? [];

  if (filesToRemove.length === 0) {
    return [];
  }

  const { error: removeError } = await supabase.storage
    .from(BACKUP_BUCKET)
    .remove(filesToRemove);

  if (removeError) {
    throw new Error(`Erro ao apagar backups antigos: ${removeError.message}`);
  }

  return filesToRemove;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const now = new Date();
    const fileName = getBackupFileName(now);

    const [bookings, bookingItems] = await Promise.all([
      fetchAllRows(supabase, "bookings"),
      fetchAllRows(supabase, "booking_items"),
    ]);

    const backup = {
      created_at: now.toISOString(),
      source: "alicantissima-app",
      version: 1,
      tables: {
        bookings,
        booking_items: bookingItems,
      },
      counts: {
        bookings: bookings.length,
        booking_items: bookingItems.length,
      },
    };

    const json = JSON.stringify(backup, null, 2);

    const { error: uploadError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(fileName, json, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Erro ao gravar backup: ${uploadError.message}`);
    }

    const removedFiles = await removeOldBackups(supabase, now);

    return NextResponse.json({
      success: true,
      file: fileName,
      counts: backup.counts,
      removed_old_backups: removedFiles,
      created_at: backup.created_at,
    });
  } catch (error) {
    console.error("Backup bookings cron error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}