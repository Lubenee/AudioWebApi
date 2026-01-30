import useCanvas from "../Hooks/useCanvas";

/**
 * ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
 * Clears previously drawn rectangle
 * 
 * ctx.fillStyle = "#000000";
 * Set the fill color for shapes drawn afterward
 *
 * ctx.beginPath();
 * Start a new drawing path (prevents connecting to previous shapes)
 *
 * (x: 50, y: 100, radius: 20, startAngle: 0, endAngle: 2π)
 * ctx.arc(50, 100, 20, 0, 2 * Math.PI);
 * Define a full circle path
 *
 * ctx.fill();
 * Fill the current path using the fill color
 */

// https://react-typescript-cheatsheet.netlify.app/docs/react-types/componentprops/
interface CanvasProps extends React.ComponentPropsWithRef<"canvas"> {
  draw: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, frameCount: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export default function Canvas({ draw, canvasRef, ...props }: CanvasProps) {
  useCanvas({draw, canvasRef});
  return <canvas ref={canvasRef} {...props} />;
}