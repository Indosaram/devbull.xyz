import svgData from './svg-data.json'

type ChartId = keyof typeof svgData

// MDX wraps bare text nodes in <p>, and <p> inside <text> makes the HTML parser
// close the <svg> early, so the figures are injected as a raw string instead.
export function Chart({ id }: { id: ChartId }) {
  return <div dangerouslySetInnerHTML={{ __html: svgData[id] }} />
}
