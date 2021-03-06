/* *
 * References:
 *  https://bl.ocks.org/Qizly/8f6ba236b79d9bb03a80
 *
 */

import * as React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'gatsby';
import * as D3 from 'd3';
import '../styles/index.css';
import Layout from '../components/layout';
import MainGraph from '../components/main-graph';
import SpeciesGraph from '../components/species-graph';
import ObsFieldsGraph from '../components/obs-fields-graph';


const parseDate = D3.timeParse('%Y-%m-%d');

const densifyData = (data, xScale) => {
  const dateGrouping = D3.timeDay;
  const denseData = xScale.ticks(dateGrouping).map((d) => {
    const found = data.find(e => e.date.getTime() === d.getTime());
    return found || { date: d, count: 0, dead: 0, alive: 0 };
  });
  return denseData;
};

const createDateGrouped = (data) => {
  /* eslint-disable no-param-reassign */
  const groupedMap2 = data.reduce((r, a) => {
    r[a.node.observed_on] = r[a.node.observed_on] || [];
    r[a.node.observed_on].push(a.node);
    return r;
  }, Object.create(null));

  const groupedMap3 = Object.keys(groupedMap2).map(e => ({
    date: parseDate(e),
    count: groupedMap2[e].length,
    species: groupedMap2[e].reduce((r, a) => {
      r[a.taxon.preferred_common_name] = r[a.taxon.preferred_common_name] || [];
      r[a.taxon.preferred_common_name].push(a.taxon);
      return r;
    }, Object.create(null)),
    dead: groupedMap2[e].filter(elem => elem.ofvs.some(field => field.value.toLowerCase() === 'dead') || elem.annotations.some(field => field.controlled_value_id === 19)).length || 0,
    alive: groupedMap2[e].filter(elem => elem.ofvs.some(field => field.value.toLowerCase() === 'alive/stunned') || elem.annotations.some(field => field.controlled_value_id === 18)).length || 0,
  }));
  /* eslint-enable no-param-reassign */

  const sortedData = groupedMap3.sort((a, b) => a.date - b.date);
  return sortedData;
};

const createSpeciesGrouped = (data, xScale) => {
  /* eslint-disable no-param-reassign */
  const speciesKey = data.reduce((r, a) => {
    r[a.node.taxon.name] = r[a.node.taxon.name] || [];
    r[a.node.taxon.name].push(a);
    return r;
  }, Object.create(null));

  const groupedMap = Object.keys(speciesKey).map(e => ({
    species: e,
    count: speciesKey[e].length,
    dates: densifyData(createDateGrouped(speciesKey[e]), xScale),
    name: speciesKey[e][0].node.taxon.preferred_common_name || e,
  })).sort((a, b) => b.count - a.count);
  /* eslint-enable no-param-reassign */

  return groupedMap;
};

const createObsFieldsGrouped = (data, xScale) => {
  /* eslint-disable no-param-reassign */
  const obsFieldsKey = data.reduce((r, a) => {
    const ofvs = a.node.ofvs;
    ofvs.forEach(field => {
      r[field.name] = r[field.name] || {};
      r[field.name][field.value] = r[field.name][field.value] + 1 || 1;
    });
    return r;
  }, Object.create(null));
  console.log(obsFieldsKey);

  const fieldsToFilter = ['Skies?', 'Wind?', 'Precipitation?', 'Location?'];

  const groupedMap = Object.keys(obsFieldsKey)
    .filter(e => fieldsToFilter.includes(e))
    .map(e => {
      const obj = {
        field: e,
      };
      Object.keys(obsFieldsKey[e]).forEach(v => obj[v] = obsFieldsKey[e][v]);
      return obj;
    });
  console.log(groupedMap);
  /* eslint-enable no-param-reassign */

  return groupedMap;
};


// markup
const IndexPage = (props) => {
  const observations = props.data.allObs.edges;
  console.log(observations);

  const margin = {
    top: 30, right: 140, bottom: 80, left: 60,
  };
  const width = 1490 - margin.left - margin.right;

  const sortedData = createDateGrouped(observations);

  const dates = sortedData.map(e => e.date);
  const xScale = D3.scaleTime().domain(D3.extent(dates)).range([0, width]);

  const denseData = densifyData(sortedData, xScale);

  const speciesGrouped = createSpeciesGrouped(observations, xScale);
  const obsFieldsGrouped = createObsFieldsGrouped(observations, xScale);

  return (
    <main>
      <title>Bird Safe Philly Data Viz</title>
      <Layout>
        <MainGraph lineData={denseData} pieData={speciesGrouped}></MainGraph>
        <ObsFieldsGraph lineData={denseData} obsFieldsData={obsFieldsGrouped}></ObsFieldsGraph>
        <SpeciesGraph data={speciesGrouped}></SpeciesGraph>
      </Layout>
    </main>
  );
};

export default IndexPage;

IndexPage.propTypes = {
  data: PropTypes.object,
};

export const query = graphql`
  query ObservationQuery2 {
    allObs: allObservation(filter: {observed_on: {gte: "2021-01-01"}}) {
      edges {
        node {
          observation_id
          observed_on
          observed_on_details {
            date
            week
            month
            hour
            year
            day
          }
          place_ids
          taxon {
            ancestor_ids
            name
            preferred_common_name
          }
          geojson {
            coordinates
            type
          }
          user
          annotations {
            controlled_attribute_id
            controlled_value_id
          }
          ofvs {
            name
            value
          }
        }
      }
    }
  }
`;
