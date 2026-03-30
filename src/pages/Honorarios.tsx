import { HonorarioMaster } from "@/components/Honorarios/HonorarioMaster";

const Honorarios = () => {
    return (
        <div className="h-[calc(100vh-4rem)]">
            <HonorarioMaster showSidebar={false} showAura={false} />
        </div>
    );
};

export default Honorarios;
