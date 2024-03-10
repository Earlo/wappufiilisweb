/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from 'd3';
import { Parser as HtmlToReactParser } from 'html-to-react';
import * as jsdom from 'jsdom';
import { ImageResponse } from 'next/og';

const data = [
  { date: +new Date('2023-11-11'), value: 100 },
  { date: +new Date('2023-11-12'), value: 60 },
  { date: +new Date('2023-11-13'), value: 180 },
  { date: +new Date('2023-11-14'), value: 20 },
  { date: +new Date('2023-11-15'), value: 60 },
  { date: +new Date('2023-11-16'), value: 50 },
];

function doThings({
  svg,
  width,
  height,
}: {
  svg: any;
  width: number;
  height: number;
}) {
  // Add X axis --> it is a date format
  const x = d3
    .scaleTime()
    .domain(
      d3.extent(data, function (d) {
        return d.date;
      }) as any,
    )
    .range([0, width])
    .nice();

  const bottomAxisEls = svg
    .append('g')
    .attr('transform', 'translate(0,' + (height - 5) + ')')
    .call(d3.axisBottom(x));
  bottomAxisEls.selectAll('text').remove();

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return +d.value;
      }) as any,
    ])
    .range([height, 0]);
  const leftAxisEls = svg
    .append('g')
    .attr('transform', 'translate(5, 0)')
    .call(d3.axisLeft(y));
  leftAxisEls.selectAll('text').remove();

  // Add the line
  svg
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)
    .attr(
      'd',
      d3
        .line()
        .x(function (d: any) {
          return x(d.date);
        })
        .y(function (d: any) {
          return y(d.value);
        }),
    );

  console.log(d3.axisBottom(x).scale().range());
  return {
    xTicks: (d3.axisBottom(x).scale() as any).ticks(),
    xTickTransforms: bottomAxisEls
      .selectAll('.tick')
      .nodes()
      .map((node: any) => node.getAttribute('transform')),
    yTicks: (d3.axisLeft(y).scale() as any).ticks(),
    yTickTransforms: leftAxisEls
      .selectAll('.tick')
      .nodes()
      .map((node: any) => node.getAttribute('transform')),
  };
}

export async function GET() {
  const { JSDOM } = jsdom;

  const { document } = new JSDOM('').window;
  //global.document = document;

  const body = d3.select(document).select('body');

  const svg = body
    .append('svg')
    .attr('width', 950)
    .attr('height', 550)
    .attr('viewBox', '0 0 1000 600');
  /*svg
    .append('line')
    .attr('x1', 100)
    .attr('y1', 100)
    .attr('x2', 200)
    .attr('y2', 200)
    .style('stroke', 'rgb(255,0,0)')
    .style('stroke-width', 2);*/

  const { xTicks, xTickTransforms, yTicks, yTickTransforms } = doThings({
    svg: svg,
    width: 1000,
    height: 600,
  });
  //console.log(body.node().innerHTML);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          padding: '25px 25px 20px 0',
        }}
      >
        <div style={{ width: 50, position: 'relative', display: 'flex' }}>
          {yTickTransforms.map((tr: any, i: any) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                display: 'flex',
                marginTop: '-12px',
                right: 0,
                transform: tr.replace(
                  /(-?\d*\.?\d+)/g,
                  (_match: any, p1: any) => `${(parseFloat(p1) / 600) * 550}px`,
                ),
              }}
            >
              {yTicks[i].toString()}
            </div>
          ))}
        </div>
        {/*<div
          style={{
            width: 50,
            display: 'flex',
            flexDirection: 'column-reverse',
            paddingBottom: 50,
          }}
        >
          {yTicks.map((y: any) => (
            <div
              key={y.toString()}
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginBottom: -12,
                }}
              >
                {y.toString()}
                <div style={{ width: 4, height: 1, background: 'black' }} />
              </div>
            </div>
          ))}
              </div>*/}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              textAlign: 'center',
              alignItems: 'center',
            }}
          >
            {new (HtmlToReactParser as any)().parse(
              (body.node()! as any).innerHTML,
            )}
          </div>
          {/*<div style={{ height: 50, display: 'flex' }}>
            {xTicks.map((x: Date) => (
              <div
                key={x.toString()}
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ width: 1, height: 4, background: 'black' }} />
                  {x.toLocaleDateString('fi-FI', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </div>
              </div>
            ))}
                </div>*/}
          <div style={{ height: 50, position: 'relative', display: 'flex' }}>
            {xTickTransforms.map((tr: any, i: any) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  display: 'flex',
                  marginLeft: '-20px',
                  transform: tr.replace(
                    /(-?\d*\.?\d+)/g,
                    (_match: any, p1: any) =>
                      `${(parseFloat(p1) / 1000) * 950}px`,
                  ),
                }}
              >
                {xTicks[i].toLocaleDateString('fi-FI', {
                  day: '2-digit',
                  month: '2-digit',
                })}
              </div>
            ))}
          </div>
        </div>
        {/*<svg
          width={1000}
          height={600}
          viewBox="0 0 1000 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g fill="#444cf7">
            {data.map((p, i) => (
              <circle
                cx={(i / data.length) * 1000}
                cy={600 - p.y}
                r="8"
                key={p.x}
              />
            ))}
          </g>
            </svg>*/}
      </div>
    ),
    {
      width: 1050,
      height: 650,
    },
  );
}
