/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import * as d3 from 'd3';
import { Parser as HtmlToReactParser } from 'html-to-react';
import * as jsdom from 'jsdom';
import { ImageResponse } from 'next/og';

// Initialize DynamoDB Client
const ddbClient = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

type Props = {
  params: { ts: string; campus: string };
};

const docClient = DynamoDBDocumentClient.from(ddbClient);

async function listAllData(params: Partial<Props['params']>) {
  const { campus } = params;

  const TableName =
    process.env.DYNAMODB_EVENTS_PER_GUILD_TABLE_NAME ||
    'FiilisData_PerGuild_staging';

  try {
    const now = new Date();
    const dayInS = 60 * 60 * 24;
    const start = now.getTime() / 1000 - 30 * dayInS;
    const end = now.getTime() / 1000;

    console.log('start', start);
    console.log('end', end);

    // Set params to fetch only the last 30 days of data
    const params: ScanCommandInput = {
      TableName,
      FilterExpression:
        '#timestamp <= :end AND #timestamp >= :start and begins_with(#pk, :campus)',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp', // Replace 'timestamp' with your actual timestamp attribute name
        '#pk': 'partition_key',
      },
      ExpressionAttributeValues: {
        ':end': end,
        ':start': start,
        ':campus': campus,
      },
    };

    const { Items } = await docClient.send(new ScanCommand(params));
    if (Items && Items.length > 0) {
      console.log(` Found ${Items.length} items`);
      const smallestTimestamp = Items.sort(
        (a, b) => a.timestamp - b.timestamp,
      )[0].timestamp;
      const smallestDate = new Date(smallestTimestamp * 1000);
      const oneDayLessThanSmallestDate = new Date(
        smallestDate.getTime() - 60 * 60 * 24 * 1000,
      );
      return Items.map((i) => ({
        date: i.timestamp,
        value: parseInt(i.score, 10),
      }))
        .filter((o) => !isNaN(o.value))
        .concat({
          date: oneDayLessThanSmallestDate.getTime() / 1000,
          value: 0,
        });
    }
    throw 'No valid data available for calculation.';
  } catch (error) {
    console.error('Error scanning table:', error);
    throw 'Error calculating average';
  }
}

function groupEntriesByDay(
  entries: { date: number; value: number }[],
): { date: number; value: number }[] {
  const averagesPerDayMap = new Map<string, { sum: number; count: number }>();

  // Accumulate values for each day
  entries.forEach((entry) => {
    const dateKey = new Date(entry.date * 1000).toISOString().slice(0, 10); // Get YYYY-MM-DD format
    const existing = averagesPerDayMap.get(dateKey);
    if (existing) {
      existing.sum += entry.value;
      existing.count++;
    } else {
      averagesPerDayMap.set(dateKey, { sum: entry.value, count: 1 });
    }
  });

  // Calculate averages and format data
  const averagesPerDayArray = Array.from(averagesPerDayMap.entries()).map(
    ([dateKey, { sum, count }]) => {
      return { date: +new Date(dateKey), value: sum / count };
    },
  );

  return averagesPerDayArray;
}

function doThings({
  data,
  svg,
  width,
  height,
}: {
  data: any;
  svg: any;
  width: number;
  height: number;
}) {
  // Add X axis --> it is a date format
  const x = d3
    .scaleTime()
    .domain(
      d3.extent(data, function (d: any) {
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
      d3.max(data, function (d: any) {
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

export async function GET(req: Request, { params }: Props) {
  const { JSDOM } = jsdom;

  const { campus } = params;

  const { document } = new JSDOM('').window;
  //global.document = document;

  const body = d3.select(document).select('body');

  const svg = body
    .append('svg')
    .attr('width', 950)
    .attr('height', 550)
    .attr('viewBox', '0 0 1000 600');

  const entries = await listAllData({ campus });
  const data = groupEntriesByDay(entries).sort((a, b) => a.date - b.date);
  const { xTicks, xTickTransforms, yTicks, yTickTransforms } = doThings({
    data,
    svg: svg,
    width: 1000,
    height: 600,
  });

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
      </div>
    ),
    {
      width: 1050,
      height: 650,
    },
  );
}
