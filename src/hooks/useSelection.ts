import { useCallback, useState } from "react";

/** 체크(다중 선택)된 사진 id 집합 */
export function useSelection() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const uncheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const checkAll = useCallback((ids: string[]) => setCheckedIds(new Set(ids)), []);
  const clear = useCallback(() => setCheckedIds(new Set()), []);

  return { checkedIds, toggle, uncheck, checkAll, clear };
}
