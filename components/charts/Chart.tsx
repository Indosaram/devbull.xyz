import svgData from './svg-data.json'

type ChartId = keyof typeof svgData

// MDX wraps bare text nodes in <p>, and <p> inside <text> makes the HTML parser
// close the <svg> early, so the figures are injected as a raw string instead.
//
// The 720px floor renders each figure 1:1 with its viewBox. Left to shrink
// freely, a 320px phone column scales 12.5px labels down to ~5.5px.
export function Chart({ id }: { id: ChartId }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]" dangerouslySetInnerHTML={{ __html: svgData[id] }} />
    </div>
  )
}
