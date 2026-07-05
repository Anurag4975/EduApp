interface Column {
  header: string
  key: string
}

interface DataTableProps {
  title: string
  columns: Column[]
  rows: Array<Record<string, React.ReactNode>>
  emptyText: string
  emptyLinkText?: string
  emptyLinkHref?: string
}

export default function DataTable({
  title,
  columns,
  rows,
  emptyText,
  emptyLinkText,
  emptyLinkHref,
}: DataTableProps) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>{title}</h2>
        <span style={styles.badge}>{rows.length} total</span>
      </div>

      {rows.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>{emptyText}</p>
          {emptyLinkText && emptyLinkHref && (
            <a href={emptyLinkHref} style={styles.emptyLink}>
              {emptyLinkText}
            </a>
          )}
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={styles.th}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    ...styles.tr,
                    backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb',
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={styles.td}>
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #f3f4f6',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 22px',
    borderBottom: '1px solid #f3f4f6',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  badge: {
    fontSize: '12px',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: '500',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '500px',
  },
  th: {
    padding: '12px 22px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #f3f4f6',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '14px 22px',
    fontSize: '14px',
    color: '#374151',
    verticalAlign: 'middle',
  },
  empty: {
    padding: '50px',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '14px',
    marginBottom: '12px',
  },
  emptyLink: {
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
  },
}