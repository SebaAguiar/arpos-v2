import { Table } from "@radix-ui/themes";

export interface TableSkeletonColumn {
  width: number;
  height?: number;
  align?: "left" | "right" | "center";
  radius?: number;
}

export function TableSkeleton({
  columns,
  rows = 5,
}: {
  columns: TableSkeletonColumn[];
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <Table.Row key={i}>
          {columns.map((col, j) => {
            const alignStyle =
              col.align === "right"
                ? { marginLeft: "auto" }
                : col.align === "center"
                  ? { margin: "0 auto" }
                  : undefined;
            return (
              <Table.Cell
                key={j}
                style={
                  col.align ? { textAlign: col.align } : undefined
                }
              >
                <div
                  style={{
                    height: col.height ?? 16,
                    width: col.width,
                    ...alignStyle,
                    backgroundColor: "var(--bg-surface-hover)",
                    borderRadius: col.radius !== undefined ? `${col.radius}px` : "4px",
                  }}
                />
              </Table.Cell>
            );
          })}
        </Table.Row>
      ))}
    </>
  );
}