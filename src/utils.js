const getType = elem => {
    
    let val;
    
    if (elem.type === "number") {
        val = Number(elem.value);
    }
    
    else if (elem.type === "boolean") {
        val = elem.value === "true";
    }
    
    else if (elem.type === "undefined") {
        val = undefined;
    }
    
    else {
        console.log("ELEM", elem);
        if (elem.type === "accessor") {
            val = "<accessor>";
        } else if (elem.type === "function") {
            val = "<function>";
        } else if (elem.type === "bigint") {
            val = BigInt(elem.value.slice(0, -1));
        } else if (elem.value === "null") {
            val = null;
        } else {
            val = elem.value;
        }
    }

    return val;
};

const unpackValues = async (preview, subtype) => {
    console.error("SUBTYPE", subtype);
    let val; 
    
    if (subtype === "array") {
        val = [];
        for (const elem of preview.properties) {
            console.error("ELEM", elem);
            val.push(getType(elem));
        }
    }

    else if (subtype === "arraybuffer") {
        val = `ArrayBuffer(${preview.properties.at(0).value})`;
    }

    else if (subtype === "dataview") {
        val = preview.properties.at(0).value;
    }

    else if (subtype === "map") {
        val = new Map();

        for (const entry of preview.entries) {
            val.set(entry.key.description, entry.value.description);
        }
    }

    else if (subtype === "typedarray") {
        let type;
        const preArray = [];

        for (const elem of preview.properties) {
            
            // test if name is an index key
            if (!isNaN(elem.name)) {
                if (elem.type === "bigint") {
                    preArray.push(elem.value.slice(0, -1));
                } else {
                    preArray.push(elem.value);
                }
            }

            else if (elem.name === "Symbol(Symbol.toStringTag)") {
                type = elem.value;
            }

        }
        val = global[type].from(preArray);
    }

    else if (subtype === "set") {
        console.error(preview);
        val = new Set();
        for (const entry of preview.entries) {
            val.add(entry.value.description);
        }
    }

    else if (typeof subtype === "undefined") {
        val = {};
        for (const elem of preview.properties) {
            val[elem.name] = getType(elem);
        }
    }

    return val;
};

class FailedError extends Error {
    constructor(message) {
        super(message);
        this.name = "FailedError";
    }
}


export default unpackValues;
export { FailedError };