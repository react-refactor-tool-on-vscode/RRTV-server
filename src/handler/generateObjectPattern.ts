import * as t from "@babel/types";
import * as _ from "lodash";

function generateObjectPattern(ids: Array<string[]>): t.ObjectPattern {
    if (_.every(ids, (idchain) => idchain.length == 0)) return; // [] or [[],[],...]
    const grouped = _.groupBy(ids, (idchain) => idchain[0]);
    const mapped = _.map(grouped, (value, key) => ({
        key: key,
        value: value.map((idchain) => idchain.slice(1)),
    }));

    const node = t.objectPattern(
        mapped.map((obj) =>
            t.objectProperty(
                t.identifier(obj.key),
                _.every(obj.value, (idchain) => idchain.length == 0)
                    ? t.identifier(obj.key)
                    : generateObjectPattern(obj.value)
            )
        )
    );

    return node;
}

export { generateObjectPattern };
