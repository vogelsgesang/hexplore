#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Adrian Vogelsgesang.
# Distributed under the terms of the Modified BSD License.

from ipywidgets import DOMWidget
from traitlets import Unicode, Bytes, Integer, Bool, List, Dict, Enum, validate, TraitError
from ._frontend import module_name, module_version

def bytes_to_json(value, widget):
    return memoryview(value)

default_columns = [
    {"rendererType": "Address", "displayBase": 16},
    {"rendererType": "Integer", "signed": False, "width": 1, "littleEndian": True, "displayBase": 16, "fixedWidth": True},
    {"rendererType": "Ascii"},
]

class HexViewer(DOMWidget):
    """A HexViewer widget
    """
    _model_name = Unicode('HexViewerModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('HexViewerView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    data = Bytes(bytes()).tag(sync=True, to_json = bytes_to_json)
    linewidth = Integer(16).tag(sync=True)
    columns = List(trait=Dict(), default_value=default_columns).tag(sync=True)
    cursor_position = Integer(0).tag(sync=True)
    selection_from = Integer(0, read_only=True).tag(sync=True)
    selection_to = Integer(1, read_only=True).tag(sync=True)
    highlight_ranges = List(trait=Dict()).tag(sync=True)


    def __init__(self, data=bytes(b'Display your data here')):
        super().__init__()
        self.data = data


    @validate('linewidth')
    def _valid_linewidth(self, proposal):
        linewidth = proposal['value']
        if linewidth < 0:
            raise TraitError('linewidth must be positive')
        if linewidth > 256:
            raise TraitError('linewidth must be <= 256')
        for c in self.columns:
            alignment = c.get("width", 1)
            if linewidth % alignment != 0:
                raise TraitError(f'linewidth must be aligned with all column widths')
        return proposal['value']


    @validate('columns')
    def _valid_columns(self, proposal):
        linewidth = self.linewidth
        for i, c in enumerate(proposal['value']):
            if "rendererType" not in c:
                raise TraitError(f'column {str(i)}: missing column type')
            if c["rendererType"] == "Address":
                expected_props = {"displayBase": [10, 16]}
                alignment = 1
            elif c["rendererType"] == "Ascii":
                expected_props = {}
                alignment = 1
            elif c["rendererType"] == "Integer":
                expected_props = {
                    "signed": [True, False],
                    "width": [1, 2, 4, 8],
                    "littleEndian": [True, False],
                    "displayBase": [2, 8, 10, 16],
                    "fixedWidth": [True, False],
                }
                alignment = c.get("width")
            else:
                raise TraitError(f'column {str(i)}: invalid column type')
            actual_keys = set(c.keys())
            expected_keys = set(expected_props.keys()).union(set(["rendererType"]))
            missing_keys = expected_keys - actual_keys
            unexpected_keys = actual_keys - expected_keys
            if len(missing_keys):
                raise TraitError(f'column {str(i)}: missing keys {missing_keys}')
            if len(unexpected_keys):
                raise TraitError(f'column {str(i)}: unexpected keys {unexpected_keys}')
            for k, valid_values in expected_props.items():
                if c[k] not in valid_values:
                    raise TraitError(f'column {i}: unsupported value for {k}. Supported values are {", ".join((str(v) for v in valid_values))}')
            if linewidth % alignment != 0:
                raise TraitError(f'column {i}: column width must be aligned with the line width')
        return proposal['value']


    @validate('cursor_position')
    def _valid_cursor_position(self, proposal):
        cursor_position = proposal['value']
        if cursor_position is None:
            return cursor_position
        if cursor_position < 0 or cursor_position >= len(self.data):
            raise TraitError('cursor_position out of range')
        return proposal['value']


    @validate('highlight_ranges')
    def _valid_highlight_ranges(self, proposal):
        expected_keys = set(["from", "to", "style"])
        known_styles = ["red", "green", "blue", "underline-red", "underline-green", "underline-blue"]
        for i, range in enumerate(proposal['value']):
            actual_keys = set(range.keys())
            missing_keys = expected_keys - actual_keys
            unexpected_keys = actual_keys - expected_keys
            if len(missing_keys):
                raise TraitError(f'range {i}: missing keys {missing_keys}')
            if len(unexpected_keys):
                raise TraitError(f'range {i}: unexpected keys {unexpected_keys}')
            if not isinstance(range["from"], int):
                raise TraitError(f'range {i}: "from" must be a positive number')
            if not isinstance(range["to"], int):
                raise TraitError(f'range {i}: "to" must be a positive number')
            if not isinstance(range["style"], str) or range["style"] not in known_styles:
                raise TraitError(f'range {i}: "style" must be one of {", ".join(known_styles)}')
        return proposal['value']