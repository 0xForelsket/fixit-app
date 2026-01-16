"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Prediction {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  predictionType: "failure" | "maintenance_due" | "replacement";
  probability: number;
  estimatedDate: string | null;
  confidence: number | null;
  createdAt: string;
}

const PREDICTION_TYPE_LABELS: Record<string, string> = {
  failure: "Failure Risk",
  maintenance_due: "Maintenance Due",
  replacement: "Replacement Needed",
};

const PREDICTION_TYPE_COLORS: Record<string, string> = {
  failure: "bg-red-500/10 text-red-600 border-red-500/20",
  maintenance_due: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  replacement: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PredictiveMaintenanceWidget() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await fetch("/api/analytics/predictions");
        if (res.ok) {
          const json = await res.json();
          setPredictions(json.data);
        } else {
          setError("Failed to load predictions");
        }
      } catch (err) {
        console.error("Failed to fetch predictions:", err);
        setError("Failed to load predictions");
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <TrendingUp className="h-4 w-4 text-primary" />
            Predictive Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-zinc-200 border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <TrendingUp className="h-4 w-4 text-primary" />
            Predictive Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <TrendingUp className="h-4 w-4 text-primary" />
            Predictive Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No active predictions
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              All equipment is operating within normal parameters
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Predictive Maintenance ({predictions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {predictions.map((prediction) => (
            <Link
              key={prediction.id}
              href={`/assets/equipment/${prediction.equipmentCode}`}
              className="block"
            >
              <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-sm">{prediction.equipmentName}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {prediction.equipmentCode}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[9px] font-black uppercase",
                      PREDICTION_TYPE_COLORS[prediction.predictionType]
                    )}
                  >
                    {PREDICTION_TYPE_LABELS[prediction.predictionType]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span
                    className={cn(
                      "font-bold",
                      prediction.probability >= 0.8
                        ? "text-red-600"
                        : prediction.probability >= 0.5
                          ? "text-amber-600"
                          : "text-green-600"
                    )}
                  >
                    {formatProbability(prediction.probability)}
                  </span>
                </div>
                {prediction.estimatedDate && (
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Est. Date</span>
                    <span className="font-medium">
                      {formatDate(prediction.estimatedDate)}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
