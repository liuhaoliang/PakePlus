export default function NotFound() {
  return (
    <div className="shell" style={{ textAlign: "center", paddingTop: 60 }}>
      <h1 className="h1">404</h1>
      <p className="muted">这页走丢了，去选个关卡开玩吧。</p>
      <a className="btn btn-primary" href="/levels">
        去选关
      </a>
    </div>
  );
}