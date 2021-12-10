import * as React from 'react';
import PropTypes from 'prop-types';
import DeadAliveBarChart from './dead-alive-bar-chart';

export default function ObsFieldsGraph({ lineData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="pt-4 pl-8">Alive/Dead (Weekly)</p>
        <DeadAliveBarChart
          data={lineData}
          height={300}
        />
      </div>
    </div>
  );
}

ObsFieldsGraph.propTypes = {
  lineData: PropTypes.array.isRequired,
  height: PropTypes.number,
};
