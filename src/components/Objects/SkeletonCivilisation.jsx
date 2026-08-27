export default function SkeletonCivilisation() {
    return (
        <div className="flex flex-col p-4 bg-base-200 rounded-3xl shadow-md w-full">
            <div className="flex items-center justify-start gap-2">
                <div className="skeleton h-4 w-4 shrink-0 rounded-full"></div>
                <div className="skeleton h-4 w-20"></div>
            </div>
            <div className="skeleton h-10 w-full mt-2"></div>
        </div>
    );
}