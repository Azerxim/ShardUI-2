import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ServerEtat from "../../components/Base/ServerEtat";
import Skeleton from "../../components/Skeleton";
// import { getNetworkInfo } from "@/components/ServerEtat";
// import { useEffect } from "react";

export default function TestPage() {
  return (
    <div>
      <main className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center">
          <Skeleton></Skeleton>
        </div>
      </main>
    </div>
  );
}
