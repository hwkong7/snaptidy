import FileRouteSelector from "../FileRouteSelector/FileRouteSelector";
import "./Header.css";

export default function Header({ routes, currentRoute, onChangeRoute }) {
  return (
    <header className="header">
      <div className="logo">SnapTidy</div>

      <FileRouteSelector
        routes={routes}
        currentRoute={currentRoute}
        onChangeRoute={onChangeRoute}
      />
    </header>
  );
}
