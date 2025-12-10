// src/components/FileRouteSelector/FileRouteSelector.jsx
import "./FileRouteSelector.css";

export default function FileRouteSelector({
  routes,
  currentRoute,
  onChangeRoute
}) {
  return (
    <select
      className="file-route"
      value={currentRoute}
      onChange={(e) => onChangeRoute(e.target.value)}
    >
      {routes.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
