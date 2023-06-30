import { findDrillingParams } from "../helper/findDrillingParams";
import parseToAst from "../helper/ParseToAst";

test("find drilling params for single function", () => {
    // const code = `
    // function Test({img, text}) {
    //     return (<>
    //         <Img src={img.src} alt={img.alt} />
    //         <span>{text}</span>
    //     </>)
    // }
    // `;
    // const result = findDrillingParams(parseToAst(code)).map(
    //     (path) => path.node.name
    // );

    // expect(result).toEqual(["text"]);

    const code1 = `
import { useState } from 'react';
import { places } from './data.js';
import { getImageUrl } from './utils.js';

export default function App() {
  const [isLarge, setIsLarge] = useState(false);
  const imageSize = isLarge ? 150 : 100;
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={isLarge}
          onChange={e => {
            setIsLarge(e.target.checked);
          }}
        />
        Use large images
      </label>
      <hr />
      <List imageSize={imageSize} />
    </>
  )
}

function List({ imageSize }) {
  const listItems = places.map(place =>
    <li key={place.id}>
      <Place
        place={place}
        imageSize={imageSize}
      />
    </li>
  );
  return <ul>{listItems}</ul>;
}

function Place({ place, imageSize }) {
  return (
    <>
      <PlaceImage
        place={place}
        imageSize={imageSize}
      />
      <p>
        <b>{place.name}</b>
        {': ' + place.description}
      </p>
    </>
  );
}

function PlaceImage({ place, imageSize }) {
  return (
    <img
      src={getImageUrl(place)}
      alt={place.name}
      width={imageSize}
      height={imageSize}
    />
  );
}
`;
    const result1 = findDrillingParams(parseToAst(code1)).map(
        (path) => path.node.name
    );
    expect(result1).toEqual(["imageSize", "place", "imageSize"]);
});
