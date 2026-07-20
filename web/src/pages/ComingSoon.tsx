import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/EmptyState";
import { useT } from "../i18n/I18nContext";

/** Temporary placeholder for a route whose real page hasn't landed yet — see
 *  tasks/INDEX.md for which phase builds it. Replaced page-by-page as each
 *  phase completes (App.tsx swaps the route's element, this file itself
 *  should shrink to zero remaining call sites by the end of Phase 9). */
export default function ComingSoon({ title }: { title: string }) {
  const t = useT();
  return (
    <div className="content-page2">
      <PageHeader title={title} />
      <EmptyState label={t("common.comingSoon")} />
    </div>
  );
}
