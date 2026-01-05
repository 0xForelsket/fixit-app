"use client";

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#18181b",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    borderBottomWidth: 4,
    borderBottomColor: "#f97316",
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  brandName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#f97316",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  brandTagline: {
    fontSize: 8,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 2,
  },
  qrCode: {
    width: 60,
    height: 60,
  },
  mainTitleSection: {
    marginBottom: 25,
  },
  woLabel: {
    fontSize: 9,
    color: "#f97316",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#18181b",
    color: "#ffffff",
    padding: "3 8",
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 4,
    overflow: "hidden",
  },
  gridBox: {
    width: "33.33%",
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#e4e4e7",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  gridBoxLast: {
    borderRightWidth: 0,
  },
  gridBoxWide: {
    width: "100%",
    borderRightWidth: 0,
    backgroundColor: "#fafafa",
  },
  boxLabel: {
    fontSize: 7,
    color: "#71717a",
    textTransform: "uppercase",
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  boxValue: {
    fontSize: 10,
    color: "#09090b",
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#000",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#f97316",
    paddingBottom: 4,
    marginBottom: 8,
  },
  descriptionBox: {
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#cbd5e1",
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: "6 0",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f4",
  },
  checkIcon: {
    width: 12,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginRight: 8,
  },
  checkText: {
    flex: 1,
    fontSize: 9,
  },
  checkStatus: {
    fontSize: 7,
    color: "#71717a",
    textTransform: "uppercase",
    padding: "2 5",
    backgroundColor: "#f4f4f5",
    borderRadius: 2,
  },
  partsTable: {
    marginTop: 5,
  },
  partsHeader: {
    flexDirection: "row",
    backgroundColor: "#f4f4f5",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  partCol1: { flex: 1, fontSize: 8, color: "#71717a" },
  partCol2: { width: 60, fontSize: 8, color: "#71717a", textAlign: "right" },
  partsRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f4",
  },
  partText: { flex: 1, fontSize: 9 },
  partQty: {
    width: 60,
    fontSize: 9,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#a1a1aa",
    textTransform: "uppercase",
  },
});

interface WorkOrderPDFProps {
  // biome-ignore lint/suspicious/noExplicitAny: Legacy PDF template
  workOrder: any;
  qrCodeUrl?: string;
}

export function WorkOrderPDF({ workOrder, qrCodeUrl }: WorkOrderPDFProps) {
  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>FixIt CMMS</Text>
            <Text style={styles.brandTagline}>Industrial Asset Management</Text>
          </View>
          <View style={styles.headerRight}>
            {qrCodeUrl && <Image src={qrCodeUrl} style={styles.qrCode} />}
          </View>
        </View>

        {/* Title */}
        <View style={styles.mainTitleSection}>
          <Text style={styles.woLabel}>WORK ORDER TICKET</Text>
          <Text style={styles.title}>{workOrder.title}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <Text>{workOrder.status}</Text>
            </View>
            <Text style={{ fontSize: 9, color: "#71717a", marginLeft: 10 }}>
              ID: WO-{workOrder.id}
            </Text>
          </View>
        </View>

        {/* Global Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.gridBox}>
            <Text style={styles.boxLabel}>Priority</Text>
            <Text
              style={[
                styles.boxValue,
                {
                  color:
                    workOrder.priority === "critical" ? "#ef4444" : "#09090b",
                },
              ]}
            >
              {workOrder.priority}
            </Text>
          </View>
          <View style={styles.gridBox}>
            <Text style={styles.boxLabel}>Type</Text>
            <Text style={styles.boxValue}>{workOrder.type}</Text>
          </View>
          <View style={[styles.gridBox, styles.gridBoxLast]}>
            <Text style={styles.boxLabel}>Department</Text>
            <Text style={styles.boxValue}>
              {workOrder.department?.name || "General"}
            </Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={styles.boxLabel}>Reported By</Text>
            <Text style={styles.boxValue}>
              {workOrder.reportedBy?.name || "Unknown"}
            </Text>
          </View>
          <View style={styles.gridBox}>
            <Text style={styles.boxLabel}>Assigned To</Text>
            <Text style={styles.boxValue}>
              {workOrder.assignedTo?.name || "Unassigned"}
            </Text>
          </View>
          <View style={[styles.gridBox, styles.gridBoxLast]}>
            <Text style={styles.boxLabel}>Target Date</Text>
            <Text style={styles.boxValue}>
              {formatDate(workOrder.dueBy) || "No deadline"}
            </Text>
          </View>

          <View style={styles.gridBoxWide}>
            <Text style={styles.boxLabel}>Equipment Details</Text>
            <Text style={styles.boxValue}>
              {workOrder.equipment?.name} ({workOrder.equipment?.code})
            </Text>
            <Text style={{ fontSize: 8, color: "#71717a", marginTop: 2 }}>
              Location: {workOrder.equipment?.location?.name || "Multiple"}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Description</Text>
          <View style={styles.descriptionBox}>
            <Text style={{ fontSize: 10 }}>{workOrder.description}</Text>
          </View>
        </View>

        {/* Checklist */}
        {workOrder.checklistItems && workOrder.checklistItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety & Task Checklist</Text>
            {/* biome-ignore lint/suspicious/noExplicitAny: Legacy */}
            {workOrder.checklistItems.map((item: any, i: number) => (
              <View key={i} style={styles.checklistRow}>
                <Text
                  style={[
                    styles.checkIcon,
                    {
                      color:
                        item.status === "completed" ? "#10b981" : "#d4d4d8",
                    },
                  ]}
                >
                  {item.status === "completed" ? "[X]" : "[ ]"}
                </Text>
                <Text style={styles.checkText}>{item.description}</Text>
                <View style={styles.checkStatus}>
                  <Text>{item.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Consumed Parts */}
        {workOrder.consumedParts && workOrder.consumedParts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spare Parts & Resources</Text>
            <View style={styles.partsTable}>
              <View style={styles.partsHeader}>
                <Text style={styles.partCol1}>Part Description</Text>
                <Text style={styles.partCol2}>Quantity</Text>
              </View>
              {/* biome-ignore lint/suspicious/noExplicitAny: Legacy */}
              {workOrder.consumedParts.map((usage: any, i: number) => (
                <View key={i} style={styles.partsRow}>
                  <Text style={styles.partText}>
                    {usage.part?.name} ({usage.part?.sku})
                  </Text>
                  <Text style={styles.partQty}>{usage.quantity} units</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resolution */}
        {workOrder.status === "resolved" && workOrder.resolutionNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution Log</Text>
            <View
              style={[styles.descriptionBox, { borderLeftColor: "#10b981" }]}
            >
              <Text style={{ fontSize: 10 }}>{workOrder.resolutionNotes}</Text>
              <Text style={{ fontSize: 7, color: "#71717a", marginTop: 5 }}>
                Closed at: {formatDate(workOrder.resolvedAt)}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Official Document - FixIt System</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
          <Text>Printed: {formatDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}
