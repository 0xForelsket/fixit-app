"use client";

import { cn } from "@/lib/utils";
import GridLayoutImport from "react-grid-layout";
import { useMemo, memo, type ReactNode, useState, useEffect, useRef } from "react";
import type { WidgetConfig } from "./types";

// Import CSS for react-grid-layout
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Define our own Layout type that matches react-grid-layout's expectations
export interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

// Type the GridLayout component properly
const GridLayout = GridLayoutImport as unknown as React.ComponentType<{
  className?: string;
  layout?: Layout[];
  cols?: number;
  rowHeight?: number;
  width: number;
  onLayoutChange?: (layout: Layout[]) => void;
  isDraggable?: boolean;
  isResizable?: boolean;
  draggableHandle?: string;
  margin?: [number, number];
  containerPadding?: [number, number];
  useCSSTransforms?: boolean;
  compactType?: "vertical" | "horizontal" | null;
  preventCollision?: boolean;
  children?: ReactNode;
}>;

interface WidgetGridProps {
  widgets: WidgetConfig[];
  onLayoutChange: (layouts: Layout[]) => void;
  children: ReactNode;
  className?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
  cols?: number;
  rowHeight?: number;
}

// Minimum sizes for different widget types
const WIDGET_MIN_SIZES: Record<string, { minW: number; minH: number }> = {
  stats_summary: { minW: 6, minH: 2 },
  bar_chart: { minW: 4, minH: 3 },
  pie_chart: { minW: 4, minH: 3 },
  data_table: { minW: 4, minH: 3 },
  text_block: { minW: 2, minH: 1 },
};

// Default sizes for new widgets
export const WIDGET_DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  stats_summary: { w: 12, h: 3 },
  bar_chart: { w: 6, h: 4 },
  pie_chart: { w: 6, h: 4 },
  data_table: { w: 12, h: 5 },
  text_block: { w: 6, h: 2 },
};

function WidgetGridComponent({
  widgets,
  onLayoutChange,
  children,
  className,
  isDraggable = true,
  isResizable = true,
  cols = 12,
  rowHeight = 60,
}: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  // Track container width for responsive grid
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        if (newWidth > 0) {
          setWidth(newWidth);
        }
      }
    };
    
    updateWidth();
    
    // Use ResizeObserver for better performance
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Convert widget layouts to react-grid-layout format
  const layout = useMemo(() => {
    return widgets.map((widget) => {
      const minSize = WIDGET_MIN_SIZES[widget.type] || { minW: 2, minH: 1 };
      return {
        i: widget.id,
        x: widget.layout.x,
        y: widget.layout.y,
        w: widget.layout.w,
        h: widget.layout.h,
        minW: minSize.minW,
        minH: minSize.minH,
      };
    });
  }, [widgets]);

  return (
    <div ref={containerRef} className={cn("widget-grid-container", className)}>
      <GridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        width={width}
        onLayoutChange={onLayoutChange}
        isDraggable={isDraggable}
        isResizable={isResizable}
        draggableHandle=".widget-drag-handle"
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
      >
        {children}
      </GridLayout>

      {/* Custom styles for the grid */}
      <style jsx global>{`
        .widget-grid-container .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }

        .widget-grid-container .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }

        .widget-grid-container .react-grid-item.resizing {
          z-index: 100;
          opacity: 0.9;
        }

        .widget-grid-container .react-grid-item.react-draggable-dragging {
          z-index: 100;
          opacity: 0.8;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
        }

        .widget-grid-container .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }

        .widget-grid-container .react-grid-item > .react-resizable-handle::after {
          content: "";
          position: absolute;
          right: 4px;
          bottom: 4px;
          width: 8px;
          height: 8px;
          border-right: 2px solid hsl(var(--muted-foreground) / 0.3);
          border-bottom: 2px solid hsl(var(--muted-foreground) / 0.3);
          border-radius: 0 0 2px 0;
        }

        .widget-grid-container .react-grid-item:hover > .react-resizable-handle::after {
          border-color: hsl(var(--primary) / 0.5);
        }

        .widget-grid-container .react-grid-placeholder {
          background: hsl(var(--primary) / 0.1);
          border: 2px dashed hsl(var(--primary) / 0.3);
          border-radius: 12px;
          opacity: 1;
          transition: all 200ms ease;
        }
      `}</style>
    </div>
  );
}

export const WidgetGrid = memo(WidgetGridComponent);

/**
 * Helper function to find the next available position for a new widget
 */
export function findNextWidgetPosition(
  widgets: WidgetConfig[],
  _widgetType: string,
  _cols = 12
): { x: number; y: number } {
  if (widgets.length === 0) {
    return { x: 0, y: 0 };
  }

  // Find the max Y position + height
  const maxY = widgets.reduce((max, widget) => {
    const bottom = widget.layout.y + widget.layout.h;
    return Math.max(max, bottom);
  }, 0);

  // For now, always place new widgets at the bottom
  return { x: 0, y: maxY };
}
