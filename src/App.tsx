import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import WaterSimulation from './components/WaterSimulation';
import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
`;

const Title = styled.h1`
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
`;

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContainer>
        <Title>Water Network Simulation</Title>
        <WaterSimulation />
      </AppContainer>
    </Provider>
  );
};

export default App;
