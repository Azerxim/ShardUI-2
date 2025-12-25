import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import ServerEtat from '../../components/Sections/ServerEtat';
import Skeleton from "../../components/Sections/Skeleton";

export default function TestPage() {
  return (
    <>
      <Navbar active="test" />
      <ServerEtat />
      <main className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center">
          <Skeleton></Skeleton>
        </div>
      </main>
    </>
  );
}
