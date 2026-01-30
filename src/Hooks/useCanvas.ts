import { useEffect } from "react";

interface Props {
    draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, frameCount: number) => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const useCanvas = ({ draw, canvasRef }: Props) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Canvas Ref is not initialized!");

        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas Context is not initialized!");

        let frameCount = 0;
        let animationFrameId: number = 0;
        const dpr = window.devicePixelRatio || 1;

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            context.scale(dpr, dpr);
        };
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const render = () => {
            frameCount++; frameCount %= 10000;
            draw(canvas, context, frameCount);

            // https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
            animationFrameId = window.requestAnimationFrame(render);
        };
        render();

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resizeCanvas);
        };
    }, [draw, canvasRef]);

};

export default useCanvas;