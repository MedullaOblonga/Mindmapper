export function Placeholder({ title }: { title: string }) {
  return (
    <div className="page-head">
      <div><h1 className="t-title">{title}</h1></div>
    </div>
  );
}
