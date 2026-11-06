import svgData from './svg-data.json'

type ChartId = keyof typeof svgData

// MDX wraps bare text nodes in <p>, and <p> inside <text> makes the HTML parser
// close the <svg> early, so the figures are injected as a raw string instead.
//
// Below `lg` the column is narrower than the 720-unit viewBox, so hold that
// width and scroll; scaling instead crushes 12.5px labels to ~5.5px.
export function Chart({ id }: { id: ChartId }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px] lg:min-w-0" dangerouslySetInnerHTML={{ __html: svgData[id] }} />
    </div>
  )
}
