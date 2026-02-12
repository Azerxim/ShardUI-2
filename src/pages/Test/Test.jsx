import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Sections/Skeleton";

export default function TestPage() {
  return (
    <>
      <Navbar active="test" />
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-center">
          <Skeleton></Skeleton>
        </div>
      </main>
    </>
  );
}
