export function traverseAssociationPath(obj, pathString, entityName, callback) {
    if (!pathString) {
        callback(null);
        return;
    }

    const parts = pathString.split('/');
    const defaultModule = entityName.split('.')[0];

    let currentId = null;
    let step = 0;

    function getAssociationName(assocPart) {
        if (assocPart.includes('.')) {
            return assocPart;
        } else {
            return `${defaultModule}.${assocPart}`;
        }
    }

    function processStep() {
        if (step === 0) {
            const fullAssocName = getAssociationName(parts[0]);
            currentId = obj.get(fullAssocName);

            if (!currentId || parts.length === 1) {
                callback(currentId);
                return;
            }

            step++;
            processStep();
        } else if (step < parts.length) {
            window.mx.data.get({
                guid: currentId,
                callback: function(intermediateObj) {
                    const fullAssocName = getAssociationName(parts[step]);
                    let nextId = intermediateObj.get(fullAssocName);

                    currentId = nextId;
                    step++;

                    if (step === parts.length) {
                        callback(currentId);
                    } else {
                        processStep();
                    }
                },
                error: function() {
                    callback(null);
                }
            });
        }
    }

    processStep();
}
