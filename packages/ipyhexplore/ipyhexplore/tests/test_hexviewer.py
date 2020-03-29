#!/usr/bin/env python
# coding: utf-8

import pytest

from ..hexviewer import HexViewer
from traitlets import TraitError

def test_default_data():
    "The data is seeded with some example data"
    w = HexViewer()
    assert w.data == b'Display your data here'

def test_constructor_data():
    "The data can be provided in the constructor"
    w = HexViewer(b'My data')
    assert w.data == b'My data'

def test_cursor_position_valid(mock_comm):
    w = HexViewer()
    assert w.cursor_position == 0
    w.cursor_position = 2
    assert w.cursor_position == 2

def test_cursor_position_negative(mock_comm):
    w = HexViewer()
    with pytest.raises(TraitError) as e:
        w.cursor_position = -1
    assert "out of range" in str(e.value)

def test_cursor_position_too_large():
    w = HexViewer()
    with pytest.raises(TraitError) as e:
        w.cursor_position = 50
    assert "out of range" in str(e.value)

def test_linewidth():
    w = HexViewer()
    assert w.linewidth == 16
    w.linewidth = 9
    assert w.linewidth == 9
    with pytest.raises(TraitError):
        w.linewidth = -1

def test_linewidth_unaligned():
    w = HexViewer()
    w.columns = [{"columnType": "Integer", "displayBase": 10, "littleEndian": True, "signed": False, "width": 2}]
    with pytest.raises(TraitError) as e:
        w.linewidth = 9
    assert "linewidth must be aligned with all column widths" in str(e.value)

def test_column_default_config():
    w = HexViewer()
    assert [c["columnType"] for c in w.columns] == ["AddressGutter", "Integer", "Ascii"]

def test_column_invalid_type():
    w = HexViewer()
    with pytest.raises(TraitError) as e:
        w.columns = [{"columnType": "Unsupported"}]
    assert "invalid column type" in str(e.value)

def test_column_missing_entries():
    w = HexViewer()
    with pytest.raises(TraitError) as e:
        w.columns = [{"columnType": "Integer"}]
    assert "missing keys" in str(e.value)

def test_column_unexpected_entries():
    w = HexViewer()
    with pytest.raises(TraitError) as e:
        w.columns = [{"columnType": "Ascii", "unknown": True}]
    assert "unexpected keys" in str(e.value)

def test_column_address_gutter():
    w = HexViewer()
    w.columns = [{"columnType": "AddressGutter", "displayBase": 10}]
    with pytest.raises(TraitError) as e:
        w.columns = [{"columnType": "AddressGutter", "displayBase": 9}]
    assert "unsupported value for displayBase. Supported values are 10, 16" in str(e.value)

def test_column_integer():
    w = HexViewer()
    w.columns = [{"columnType": "Integer", "displayBase": 10, "littleEndian": True, "signed": False, "width": 2}]
    with pytest.raises(TraitError) as e:
        w.columns = [{"columnType": "Integer", "displayBase": 9, "littleEndian": True, "signed": False, "width": 2}]
    assert "unsupported value for displayBase. Supported values are 2, 8, 10, 16" in str(e.value)

def test_column_integer_unaligned():
    w = HexViewer()
    w.linewidth = 9
    with pytest.raises(TraitError) as e:
        w.columns = [{"columnType": "Integer", "displayBase": 10, "littleEndian": True, "signed": False, "width": 2}]
    assert "must be aligned with the line width" in str(e.value)

def test_highlight_ranges():
    w = HexViewer()
    w.highlight_ranges = [{"from": 2, "to": 5, "style": "blue"}]

def test_highlight_ranges_unexpected_key():
    w = HexViewer()
    with pytest.raises(TraitError) as e:
        w.highlight_ranges = [{"from": 2, "to": 5, "style": "blue", "unknown": False}]
    assert "unexpected keys" in str(e.value)

def test_highlight_ranges_missing_key():
    w = HexViewer()
    with pytest.raises(TraitError) as e:
        w.highlight_ranges = [{"from": 2, "to": 5}]
    assert "missing keys" in str(e.value)

def test_highlight_ranges_invalid_from():
    w = HexViewer()
    with pytest.raises(TraitError) as e:
        w.highlight_ranges = [{"from": 2, "to": "eof", "style": "blue"}]
    assert "must be a positive number" in str(e.value)