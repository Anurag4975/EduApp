export default function StatsGrid({ children }: { children: React.ReactNode }) {
  return <div style={styles.grid}>{children}</div>
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
}