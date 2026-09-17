import { STAGES } from "@/lib/types";

export default function StageRail({ stage }: { stage: number }) {
  return (
    <div className="mt-5 flex items-center">
      {STAGES.map((label, i) => {
        const done = i < stage;
        const now = i === stage;
        return (
          <div key={label} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <div
                className={`absolute left-[-50%] right-1/2 top-[9px] h-0.5 ${
                  i <= stage ? "bg-gold" : "bg-line"
                }`}
              />
            )}
            <div
              className={`z-[1] h-[18px] w-[18px] rounded-full border-2 ${
                done
                  ? "border-gold bg-gold"
                  : now
                  ? "border-goldbright bg-bg shadow-[0_0_0_4px_rgba(232,84,11,.18)]"
                  : "border-line bg-bgraise"
              }`}
            />
            <div
              className={`mt-2 text-center font-display text-[9px] font-semibold uppercase tracking-wide leading-tight ${
                now ? "text-goldbright" : done ? "text-inkmid" : "text-inkdim"
              }`}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
