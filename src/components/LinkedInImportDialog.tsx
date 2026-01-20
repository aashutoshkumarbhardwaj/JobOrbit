import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JSZip from "jszip";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export function LinkedInImportDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setLoading(true);

    try {
      const zip = await JSZip.loadAsync(file);
      const csvFile = zip.file("Applied_Jobs.csv");

      if (!csvFile) {
        throw new Error("Applied_Jobs.csv not found in the ZIP file.");
      }

      const csvData = await csvFile.async("string");

      Papa.parse(csvData, {
        header: true,
        complete: async (results) => {
          const jobsToInsert = results.data
            .map((row: any) => ({
              user_id: user.id,
              company: row["Company Name"],
              role: row["Job Title"],
              url: row["Job URL"],
              applied_date: row["Application Date"],
              status: 'applied', // Default status
            }))
            .filter(job => job.company && job.role);

          if (jobsToInsert.length > 0) {
            const { error } = await supabase.from("jobs").insert(jobsToInsert);
            if (error) {
              throw new Error(error.message);
            }
            toast({
              title: "Import Successful",
              description: `${jobsToInsert.length} jobs have been imported.`,
            });
          } else {
            toast({
              title: "No new jobs to import",
              description: "The CSV file did not contain any new job applications.",
              variant: "destructive",
            });
          }

          setLoading(false);
          onOpenChange(false);
        },
        error: (error: any) => {
          throw new Error(error.message);
        }
      });
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from LinkedIn</DialogTitle>
          <DialogDescription>
            Upload the ZIP file you downloaded from your LinkedIn data archive.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="linkedin-zip" className="text-right">
              ZIP File
            </Label>
            <Input id="linkedin-zip" type="file" accept=".zip" onChange={handleFileChange} className="col-span-3" />
          </div>
          <div className="text-sm text-muted-foreground col-span-4">
            <p>
              To get your data from LinkedIn:
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to: <a href="https://www.linkedin.com/mypreferences/d/download-my-data" target="_blank" rel="noopener noreferrer" className="text-primary underline">linkedin.com/mypreferences/d/download-my-data</a></li>
              <li>Select "Download larger data archive".</li>
              <li>You'll receive an email with a link to download a ZIP file.</li>
            </ol>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
