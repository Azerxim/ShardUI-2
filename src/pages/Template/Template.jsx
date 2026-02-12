import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navigation/Navbar";
import Skeleton from "../../components/Sections/Skeleton";

import './Template.css';

export default function TemplatePage() {
  return (
    <>
      <Navbar active="template" />
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-center gap-2">
          <Skeleton></Skeleton>
        </div>
      </main>
    </>
  );
}
