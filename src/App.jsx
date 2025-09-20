import { useEffect, useRef, useState } from 'react';
import Places from './components/Places.jsx';
import { AVAILABLE_PLACES } from './data.js';
import Modal from './components/Modal.jsx';
import DeleteConfirmation from './components/DeleteConfirmation.jsx';
import logoImg from './assets/logo.png';
import { sortPlacesByDistance } from './loc.js';

const TIMER = 3000;

function App() {
  const modal = useRef(null);
  const selectedPlace = useRef(null);

  const [pickedPlaces, setPickedPlaces] = useState([]);
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [remainingTime, setRemainingTime] = useState(TIMER);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime((prev) => Math.max(prev - 10, 0));
    }, 10);

    return () => clearInterval(interval); // cleanup
  }, []);

  // Load saved picked places from localStorage
  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem('selectedPlaces')) || [];
    const savedPlaces = AVAILABLE_PLACES.filter((place) =>
      savedIds.includes(place.id)
    );
    setPickedPlaces(savedPlaces);
  }, []);

  // Get user location and sort places
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const sortedPlaces = sortPlacesByDistance(
            AVAILABLE_PLACES,
            position.coords.latitude,
            position.coords.longitude
          );
          setAvailablePlaces(sortedPlaces);
        },
        () => setAvailablePlaces(AVAILABLE_PLACES) // fallback
      );
    } else {
      setAvailablePlaces(AVAILABLE_PLACES);
    }
  }, []);

  function handleStartRemovePlace(id) {
    modal.current.open();
    selectedPlace.current = id;
    setRemainingTime(TIMER); // reset timer when modal opens
  }

  function handleStopRemovePlace() {
    modal.current.close();
  }

  function handleSelectPlace(id) {
    setPickedPlaces((prev) => {
      if (prev.some((place) => place.id === id)) return prev;
      const place = AVAILABLE_PLACES.find((place) => place.id === id);
      return [place, ...prev];
    });

    const storedIds = JSON.parse(localStorage.getItem('selectedPlaces')) || [];
    if (!storedIds.includes(id)) {
      localStorage.setItem('selectedPlaces', JSON.stringify([id, ...storedIds]));
    }
  }

  function handleRemovePlace() {
    setPickedPlaces((prev) =>
      prev.filter((place) => place.id !== selectedPlace.current)
    );

    const storedIds = JSON.parse(localStorage.getItem('selectedPlaces')) || [];
    localStorage.setItem(
      'selectedPlaces',
      JSON.stringify(storedIds.filter((id) => id !== selectedPlace.current))
    );

    modal.current.close();
  }

  return (
    <>
      <Modal ref={modal}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
          remainingTime={remainingTime}
          TIMER={TIMER}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>

      <main>
        <Places
          title="I'd like to visit ..."
          fallbackText="Select the places you would like to visit below."
          places={pickedPlaces}
          onSelectPlace={handleStartRemovePlace}
        />
        <Places
          title="Available Places"
          fallbackText="Sorting places by distance ..."
          places={availablePlaces}
          onSelectPlace={handleSelectPlace}
        />
      </main>
    </>
  );
}

export default App;
