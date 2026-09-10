import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Table } from "@radix-ui/themes";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

describe("TableSkeleton", () => {
  it("renders the configured number of rows and columns", () => {
    const { container } = render(
      <Table.Root>
        <Table.Body>
          <TableSkeleton
            columns={[
              { width: 80 },
              { width: 120, align: "right", height: 24 },
            ]}
            rows={3}
          />
        </Table.Body>
      </Table.Root>,
    );
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(3);
    expect(rows[0]?.querySelectorAll("td div")).toHaveLength(2);
  });

  it("defaults to 5 rows", () => {
    const { container } = render(
      <Table.Root>
        <Table.Body>
          <TableSkeleton columns={[{ width: 80 }]} />
        </Table.Body>
      </Table.Root>,
    );
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
  });
});