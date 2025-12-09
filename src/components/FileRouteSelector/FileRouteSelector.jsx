import "./FileRouteSelector.css";

export default function FileRouteSelector({ routes, currentRoute, onChangeRoute }) {
  return (
    <select
      className="file-route"
      value={currentRoute}
      onChange={(e) => onChangeRoute(e.target.value)}
    >
      {routes.map((r) => (
        <option key={r}>{r}</option>
      ))}
      <option>기타 위치 선택</option>
    </select>
  );
}
