import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Objects/Skeleton";

export default function ReligionPage() {
  return (
    <>
      <Navbar active="religions" />
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-center gap-2">
          <Skeleton></Skeleton>
        </div>
      </main>
    </>
  );
}
