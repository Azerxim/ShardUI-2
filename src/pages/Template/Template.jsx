import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Skeleton from "../../components/Skeleton";

export default function TemplatePage() {
  return (
    <div>
      <main className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          <Skeleton></Skeleton>
        </div>
      </main>
    </div>
  );
}
