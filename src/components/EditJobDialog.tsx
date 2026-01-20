import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Briefcase, MapPin, DollarSign, Link2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  company: string;
  role: string;
  status: string;
  location?: string;
  salary?: string;
  url?: string;
  notes?: string;
}

interface EditJobDialogProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobUpdated: () => void;
}

export function EditJobDialog({ job, open, onOpenChange, onJobUpdated }: EditJobDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company: "",
    role: "",
    status: "applied",
    location: "",
    salary: "",
    url: "",
    notes: "",
  });

  useEffect(() => {
    if (job) {
      setFormData({
        company: job.company || "",
        role: job.role || "",
        status: job.status || "applied",
        location: job.location || "",
        salary: job.salary || "",
        url: job.url || "",
        notes: job.notes || "",
      });
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        company: formData.company,
        role: formData.role,
        status: formData.status,
        location: formData.location || null,
        salary: formData.salary || null,
        url: formData.url || null,
        notes: formData.notes || null,
      })
      .eq("id", job.id);

    if (error) {
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Job updated! ✅",
        description: `${formData.role} at ${formData.company} has been updated.`,
      });
      onJobUpdated();
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            Edit Job Application
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the details for this job application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-foreground font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company *
              </Label>
              <Input
                id="company"
                placeholder="Google"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="h-11 bg-muted/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Role *
              </Label>
              <Input
                id="role"
                placeholder="Software Engineer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="h-11 bg-muted/50"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-foreground font-medium">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-11 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_apply">To Apply</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-foreground font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="San Francisco, CA"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-11 bg-muted/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-foreground font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Salary
              </Label>
              <Input
                id="salary"
                placeholder="$120,000 - $150,000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="h-11 bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="text-foreground font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                Job URL
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="h-11 bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this application..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-muted/50 min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Updating..." : "Update Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
